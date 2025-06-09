
## Steps to do rest call to k3s server and get response :

### Reference:
kubernetes documentation will work for k3s also. So please follow below link.

https://kubernetes.io/docs/reference/using-api/api-concepts/#resource-uris

### Step-1: Extract the base64-encoded CA certificate data

```
ca_cert_data=$(grep 'certificate-authority-data' /etc/rancher/k3s/k3s.yaml | awk '{print $2}')
```

### Step-2: Decode and save the CA certificate to a file
```
echo "$ca_cert_data" | base64 -d > ca.crt
```

### Step-3: Curl Command to run to get nodes information

```
curl --cacert /var/lib/rancher/k3s/server/tls/ca.crt --cert /var/lib/rancher/k3s/server/tls/client-admin.crt --key /var/lib/rancher/k3s/server/tls/client-admin.key https://127.0.0.1:6443/api/v1/nodes
```

### Output:
```
{
  "kind": "NodeList",
  "apiVersion": "v1",
  "metadata": {
    "resourceVersion": "119763"
  },
  "items": [
    {
      "metadata": {
        "name": "komal-hp-probook-430-g8-notebook-pc",
        "uid": "4fa5adff-ee16-4ac9-8cc4-b3bdb1d4ece3",
        "resourceVersion": "119751",
        "creationTimestamp": "2024-01-12T07:44:28Z",
        "labels": {
          "beta.kubernetes.io/arch": "amd64",
          "beta.kubernetes.io/instance-type": "k3s",
          "beta.kubernetes.io/os": "linux",
          "kubernetes.io/arch": "amd64",
          "kubernetes.io/hostname": "komal-hp-probook-430-g8-notebook-pc",
          "kubernetes.io/os": "linux",
          "node-role.kubernetes.io/control-plane": "true",
          "node-role.kubernetes.io/master": "true",
          "node.kubernetes.io/instance-type": "k3s"
        },
        "annotations": {
          "alpha.kubernetes.io/provided-node-ip": "192.168.241.250,2409:40f0:11:8e92:71:c807:1524:2fe7",
          "flannel.alpha.coreos.com/backend-data": "{\"VNI\":1,\"VtepMAC\":\"02:d3:a3:f6:bb:b4\"}",
          "flannel.alpha.coreos.com/backend-type": "vxlan",
          "flannel.alpha.coreos.com/kube-subnet-manager": "true",
          "flannel.alpha.coreos.com/public-ip": "192.168.241.250",
          "k3s.io/hostname": "komal-hp-probook-430-g8-notebook-pc",
          "k3s.io/internal-ip": "192.168.241.250,2409:40f0:11:8e92:71:c807:1524:2fe7",
          "k3s.io/node-args": "[\"server\"]",
          "k3s.io/node-config-hash": "4X6FFBYGNZCCKC4WZILLGNG5RGJQDDYNTTQWYJSFA474RBARXQ4A====",
          "k3s.io/node-env": "{\"K3S_DATA_DIR\":\"/var/lib/rancher/k3s/data/28f7e87eba734b7f7731dc900e2c84e0e98ce869f3dcf57f65dc7bbb80e12e56\"}",
          "node.alpha.kubernetes.io/ttl": "0",
          "volumes.kubernetes.io/controller-managed-attach-detach": "true"
        },
        "finalizers": [
          "wrangler.cattle.io/node"
        ]
      },
      "spec": {
        "podCIDR": "10.42.0.0/24",
        "podCIDRs": [
          "10.42.0.0/24"
        ],
        "providerID": "k3s://komal-hp-probook-430-g8-notebook-pc"
      },
      "status": {
        "capacity": {
          "cpu": "8",
          "ephemeral-storage": "258423140Ki",
          "hugepages-1Gi": "0",
          "hugepages-2Mi": "0",
          "memory": "16048904Ki",
          "pods": "110"
        },
        "allocatable": {
          "cpu": "8",
          "ephemeral-storage": "251394030395",
          "hugepages-1Gi": "0",
          "hugepages-2Mi": "0",
          "memory": "16048904Ki",
          "pods": "110"
        },
        "conditions": [
          {
            "type": "MemoryPressure",
            "status": "False",
            "lastHeartbeatTime": "2024-02-05T07:45:04Z",
            "lastTransitionTime": "2024-01-31T11:57:57Z",
            "reason": "KubeletHasSufficientMemory",
            "message": "kubelet has sufficient memory available"
          },
          {
            "type": "DiskPressure",
            "status": "False",
            "lastHeartbeatTime": "2024-02-05T07:45:04Z",
            "lastTransitionTime": "2024-01-31T11:57:57Z",
            "reason": "KubeletHasNoDiskPressure",
            "message": "kubelet has no disk pressure"
          },
          {
            "type": "PIDPressure",
            "status": "False",
            "lastHeartbeatTime": "2024-02-05T07:45:04Z",
            "lastTransitionTime": "2024-01-31T11:57:57Z",
            "reason": "KubeletHasSufficientPID",
            "message": "kubelet has sufficient PID available"
          },
          {
            "type": "Ready",
            "status": "True",
            "lastHeartbeatTime": "2024-02-05T07:45:04Z",
            "lastTransitionTime": "2024-02-04T11:50:48Z",
            "reason": "KubeletReady",
            "message": "kubelet is posting ready status. AppArmor enabled"
          }
        ],
        "addresses": [
          {
            "type": "InternalIP",
            "address": "192.168.241.250"
          },
          {
            "type": "InternalIP",
            "address": "2409:40f0:11:8e92:71:c807:1524:2fe7"
          },
          {
            "type": "Hostname",
            "address": "komal-hp-probook-430-g8-notebook-pc"
          }
        ],
        "daemonEndpoints": {
          "kubeletEndpoint": {
            "Port": 10250
          }
        },
        "nodeInfo": {
          "machineID": "06bade0b638341c0820ebbd8d7b82591",
          "systemUUID": "096e569c-9682-4b6f-a8d0-ffcf5ad793e9",
          "bootID": "b6b108c1-a996-4698-854c-fe4547b0f607",
          "kernelVersion": "5.15.0-92-generic",
          "osImage": "Ubuntu 20.04.6 LTS",
          "containerRuntimeVersion": "containerd://1.7.11-k3s2",
          "kubeletVersion": "v1.28.5+k3s1",
          "kubeProxyVersion": "v1.28.5+k3s1",
          "operatingSystem": "linux",
          "architecture": "amd64"
        },
        "images": [
          {
            "names": [
              "docker.io/rancher/klipper-helm@sha256:b0b0c4f73f2391697edb52adffe4fc490de1c8590606024515bb906b2813554a",
              "docker.io/rancher/klipper-helm:v0.8.2-build20230815"
            ],
            "sizeBytes": 90877642
          },
          {
            "names": [
              "docker.io/library/nginx@sha256:6959ee03b2d6a01addb4fb5e26c5ef95c60bd3108d810636409ce63f02924ad3",
              "docker.io/library/nginx:latest"
            ],
            "sizeBytes": 70520324
          },
          {
            "names": [
              "docker.io/rancher/mirrored-library-traefik@sha256:ca9c8fbe001070c546a75184e3fd7f08c3e47dfc1e89bff6fe2edd302accfaec",
              "docker.io/rancher/mirrored-library-traefik:2.10.5"
            ],
            "sizeBytes": 43142359
          },
          {
            "names": [
              "docker.io/rancher/mirrored-metrics-server@sha256:c2dfd72bafd6406ed306d9fbd07f55c496b004293d13d3de88a4567eacc36558",
              "docker.io/rancher/mirrored-metrics-server:v0.6.3"
            ],
            "sizeBytes": 29943298
          },
          {
            "names": [
              "docker.io/rancher/mirrored-coredns-coredns@sha256:a11fafae1f8037cbbd66c5afa40ba2423936b72b4fd50a7034a7e8b955163594",
              "docker.io/rancher/mirrored-coredns-coredns:1.10.1"
            ],
            "sizeBytes": 16190137
          },
          {
            "names": [
              "docker.io/rancher/local-path-provisioner@sha256:5bb33992a4ec3034c28b5e0b3c4c2ac35d3613b25b79455eb4b1a95adc82cdc0",
              "docker.io/rancher/local-path-provisioner:v0.0.24"
            ],
            "sizeBytes": 14887612
          },
          {
            "names": [
              "docker.io/rancher/klipper-lb@sha256:d6780e97ac25454b56f88410b236d52572518040f11d0db5c6baaac0d2fcf860",
              "docker.io/rancher/klipper-lb:v0.4.4"
            ],
            "sizeBytes": 4921566
          },
          {
            "names": [
              "docker.io/rancher/mirrored-pause@sha256:74c4244427b7312c5b901fe0f67cbc53683d06f4f24c6faee65d4182bf0fa893",
              "docker.io/rancher/mirrored-pause:3.6"
            ],
            "sizeBytes": 301463
          }
        ]
      }
    }
  ]
}
```