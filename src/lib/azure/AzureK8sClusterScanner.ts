import k8s from '@kubernetes/client-node';
import { createInterface } from "readline";
import { execSync } from 'child_process';

export async function AzureK8sClusterScanner(azurek8sclusterresource) {
    const rl = createInterface({
        input: process.stdin,
        output: process.stdout
    });

    let resources = {};
    
    try {
        rl.write(`\nRetrieving Kubeconfig for AKS Cluster: ${azurek8sclusterresource.clusterName}`);
        execSync(`az aks get-credentials --resource-group ${azurek8sclusterresource.resourceGroup} --name ${azurek8sclusterresource.clusterName} --overwrite-existing`);
        
        const kc = new k8s.KubeConfig();
        kc.loadFromDefault();
        const k8sApi = kc.makeApiClient(k8s.CoreV1Api);
        
        rl.write(`\nScanning Pods in AKS Cluster: ${azurek8sclusterresource.clusterName}`);
        const podList = await k8sApi.listPodForAllNamespaces();
        
        for (const pod of podList.items) {
            const podResource = {
                id: pod.metadata.uid,
                name: pod.metadata.name,
                namespace: pod.metadata.namespace,
                status: pod.status.phase,
                node: pod.spec.nodeName,
                containers: pod.spec.containers.map(container => ({
                    name: container.name,
                    image: container.image
                }))
            };
            
            rl.write(`\nFound Pod: ${podResource.name} in Namespace: ${podResource.namespace}`);
            resources[podResource.id] = podResource;
        }
    } catch (err) {
        rl.write(`\nError scanning AKS cluster: ${err.message}`);
    }
    
    rl.write("\n");
    return resources;
}
