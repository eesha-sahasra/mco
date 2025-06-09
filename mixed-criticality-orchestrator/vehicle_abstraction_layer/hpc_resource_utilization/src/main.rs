use std::thread;
use std::time::{Duration, SystemTime, Instant};
use chrono::{DateTime, Local};
use std::sync::{Arc, Mutex};
use tokio::runtime::Runtime;
use sysinfo::{ProcessorExt, System, SystemExt};
use rumqttc::{MqttOptions, Client, QoS};
use std::thread::sleep;

// Set the desired frequency in milliseconds to update the system cpu/mem usage data
const LOOP_FREQUENCY_MS : u64 = 550;

fn hpc_resource_utilization(client: Arc<Mutex<Client>>, system: &mut System, loop_frequency: u64) {

    // Refresh the CPU and memory data
    let start = Instant::now();

    system.refresh_cpu();
    system.refresh_memory();

    let (pod_cpu_usage, pod_memory_usage) = (0.0, 0.0);

    let mut total_cpu_usage: f32 = 0.0;
    for (_core, processor) in system.processors().iter().enumerate() {
        total_cpu_usage += processor.cpu_usage() as f32;
    }

    total_cpu_usage /= system.processors().len() as f32;
    // println!("Total CPU Usage before adding: {}%", total_cpu_usage);
    total_cpu_usage = total_cpu_usage + pod_cpu_usage as f32;
    let total_cpu_usage_string = total_cpu_usage.to_string();
    let total_cpu_usage_bytes = total_cpu_usage_string.into_bytes();

    // Get total and free memory
    let total_memory = system.total_memory();
    let free_memory = system.available_memory();
    let mut memory_usage: f32 = ((total_memory as f32 - free_memory as f32)/total_memory as f32)* 100.0;
    // println!("Total Memory Usage before adding: {}%", memory_usage);
    memory_usage = memory_usage + pod_memory_usage as f32;
    let memory_usage_string = memory_usage.to_string();
    let memory_usage_bytes = memory_usage_string.into_bytes();

    // Get the current system time
    let system_time = SystemTime::now();
    let datetime: DateTime<Local> = DateTime::from(system_time);
    let system_time_string = datetime.format("%Y-%m-%d %H:%M:%S%.3f").to_string();
    let system_time_bytes = system_time_string.clone().into_bytes();

    println!("Final CPU usage: {}%", total_cpu_usage);
    println!("Final Memory usage: {}%", memory_usage);
    println!("System Time: {}", system_time_string);

    // Publish the CPU and memory usage data
    let rt = Runtime::new().unwrap();
    rt.block_on(async {
        let client = Arc::clone(&client);
        tokio::spawn(async move {
            let mut client = client.lock().unwrap();
            client.publish("resource/cpu_usage", QoS::AtLeastOnce, false, total_cpu_usage_bytes).unwrap();
            client.publish("resource/memory_usage", QoS::AtLeastOnce, false, memory_usage_bytes).unwrap();
            client.publish("resource/system_time", QoS::AtLeastOnce, false, system_time_bytes).unwrap();
        }).await.unwrap();
    });

    let elapsed_duration = start.elapsed();
    // println!("Time taken for cpu/mem usage computation: {:?}", elapsed_duration);

    // Adjust the loop frequency dynamically based on elapsed time
    let loop_duration = Duration::from_millis(loop_frequency);
    if elapsed_duration < loop_duration {
        // Sleep for the remaining duration
        let duration_to_sleep = loop_duration - elapsed_duration;
        sleep(duration_to_sleep);
    }

    let total_loop_time = start.elapsed();
    println!("Total Loop Time : {:?}", total_loop_time);
}

fn main(){
    // Create a new MQTT client
    let mut mqttoptions = MqttOptions::new("publisher", "localhost", 1883);
    mqttoptions.set_keep_alive(60);

    let (client, mut connection) = Client::new(mqttoptions, 10);
    let client = Arc::new(Mutex::new(client));

    // Start a new thread to handle network events
    thread::spawn(move || {
        for event in connection.iter() {
            match event {
                Ok(v) => println!("Event: {:?}", v),
                Err(e) => println!("Error: {:?}", e),
            }
        }
    });

    let mut system = System::new_all();

    loop {
        hpc_resource_utilization(Arc::clone(&client), &mut system,LOOP_FREQUENCY_MS);
    }
}
