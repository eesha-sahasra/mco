import os
import sounddevice as sd
import numpy as np

def check_audio_devices():
    input_devices = []
    output_devices = []

    if not os.path.exists("/dev/snd/"):
        print("No audio devices found!")
        return

    devices = os.listdir("/dev/snd/")

    for device in devices:
        if 'pcm' in device:
            if device.endswith('c'):
                input_devices.append(device)
            elif device.endswith('p'):
                output_devices.append(device)

    if input_devices:
        print("Input Devices (Capture):", input_devices)
    else:
        print("No Input Devices Found")

    if output_devices:
        print("Output Devices (Playback):", output_devices)
    else:
        print("No Output Devices Found")

    test_audio_devices()

def test_audio_devices():
    try:
        print("\nChecking Input Device (Recording)...")
        recording = sd.rec(int(2 * 44100), samplerate=44100, channels=2, dtype='int16')
        sd.wait()
        print("Input device is accessible!")

        print("\nChecking Output Device (Playback)...")
        beep = np.sin(2 * np.pi * 440 * np.linspace(0, 1, 44100))
        sd.play(beep, samplerate=44100)
        sd.wait()
        print("Output device is accessible!")

    except Exception as e:
        print("Audio device access failed:", e)

if __name__ == "__main__":
    check_audio_devices()

