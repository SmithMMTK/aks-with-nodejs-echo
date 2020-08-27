for i in $(seq 0 2); do 
  kubectl -n tls-kafka cp ./setup_ssl.sh "kafkaclient-$i:/opt/kafka/setup_ssl.sh"
  kubectl -n tls-kafka exec -it "kafkaclient-$i" -- bash setup_ssl.sh
done