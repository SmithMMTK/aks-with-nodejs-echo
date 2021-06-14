# aks-with-nodejs-echo

# AKS Build Script

### Generate ssh key pair
```bash
ssh-keygen -m PEM -t rsa -b 4096

## Public / Private default directory is ~/.ssh
cd ~/.ssh

## You should see list of Public / Private key pair
ls
```

---
### Create Infrastucture
```bash
export rg="aksRGname"
export vnet="aksRGvnet"
export addressprefixes="10.0.0.0/16"
export subnetname="workload"
export subnetprefixes="10.0.0.0/24"

export subnetname2="backend"
export subnetprefixes2="10.0.1.0/24"

export akscidr="10.1.100.0/24"
export aksdns="10.1.100.10"

export aks="az-akscluster"
export acr="azacrsmi15"

## Create Azure Resource Group
az group create -n $rg -l southeastasia

## Create Virtual Network
az network vnet create \
    --address-prefixes $addressprefixes \
    --name $vnet \
    --resource-group $rg \
    --subnet-name $subnetname \
    --subnet-prefixes $subnetprefixes

## Create Additional Subnet
az network vnet subnet create \
    -g $rg \
    --vnet-name $vnet \
    -n $subnetname2 \
    --address-prefixes $subnetprefixes2

## Create Network Security Group
az network nsg create \
    -g $rg \
    -n $subnetname
az network nsg create \
    -g $rg \
    -n $subnetname2

## Create NSG Rule to allow SSH
az network nsg rule create \
    -g $rg \
    --nsg-name $subnetname \
    -n "Allow SSH" \
    --priority 400 \
    --source-address-prefixes Internet \
    --destination-address-prefixes VirtualNetwork \
    --destination-port-ranges 22 \
    --direction Inbound \
    --access Allow \
    --protocol Tcp \
    --description "Allow SSH from Internet."

## Assign NSG to Subnet
az network vnet subnet update \
-g $rg \
-n $subnetname \
--vnet-name $vnet \
--network-security-group $subnetname
```
---

### Create ACR 
```bash
az acr create --resource-group $rg --name $acr --sku Basic
az acr login --name $acr
```

### Create service principle
```bash
az ad sp create-for-rbac --skip-assignment
```

```json
{
  "appId": "26d20bc8-028b-4db1-8456-82fd1b825ef7",
  "displayName": "azure-cli-2020-07-15-04-23-45",
  "name": "http://azure-cli-2020-07-15-04-23-45",
  "password": "AEJy2Cxk4qXPdWoO4OBH-OcPgYWWtNe5-o",
  "tenant": "72f988bf-86f1-41af-91ab-2d7cd011db47"
}
```

### Assign service principle for AKS cluster network
```bash
export appid=$envAPPID
export clientsecret=$envCLIENTSECRET

export VNET_ID=$(az network vnet show --resource-group $rg --name $vnet --query id -o tsv)
export SUBNET_ID=$(az network vnet subnet show --resource-group $rg --vnet-name $vnet --name $subnetname --query id -o tsv)


az role assignment create --assignee $appid --scope $VNET_ID --role "Network Contributor"
```

### Create AKS Cluster in VNET
```bash

#export akscidr="10.1.100.0/24"
#export aksdns="10.1.100.10"

az aks create \
    --resource-group $rg \
    --name $aks \
    --node-count 2 \
    --network-plugin kubenet \
    --service-cidr $akscidr \
    --dns-service-ip $aksdns \
    --pod-cidr 10.244.0.0/16 \
    --docker-bridge-address 172.17.0.1/16 \
    --vnet-subnet-id $SUBNET_ID \
    --service-principal $appid \
    --client-secret $clientsecret \
    --ssh-key-value "@~/.ssh/mykey.pub" \
    --attach-acr $acr \
    --load-balancer-sku basic \
    --node-vm-size Standard_DS2_v2


# az group create -n 20200118-aks -l southeastasia
# az aks create --resource-group 20200118-aks --name myAKSCluster --node-count 1 --enable-addons monitoring --generate-ssh-keys --node-vm-size Standard_A2_v2
# az group delete -n 20200118-aks --no-wait

az aks get-credentials --resource-group $rg --name $aks

```

### Deploy sample application
```bash
## Pre-work: Download Azure Vote Front sample yaml 
kubectl apply -f votefront.yaml
```

Use Basic Contoller 
https://docs.microsoft.com/en-us/azure/aks/ingress-basic 

Egress by IP
https://docs.microsoft.com/en-us/azure/aks/egress 

### Test Egress IP
```bash
kubectl run -it --rm aks-ip --image=debian --generator=run-pod/v1

apt-get update && apt-get install curl -y

$ curl -s checkip.dyndns.org

<html><head><title>Current IP Check</title></head><body>Current IP Address: xxx.xxx.xxx.xxx </body></html>
```


### Creat Sidecar VM in same VNET and install Nodejs
```bash
curl -sL https://deb.nodesource.com/setup_12.x | sudo -E bash -
sudo apt install nodejs
```

### Clean up resource
```bash
 az ad sp list -o table
 az ad sp delete -id $appid

 az group delete -n $rg --no-wait
```

---