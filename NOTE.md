// Clean up all container

At saas-infra
```bash
docker-compose down -v
docker rm -f $(docker ps -aq --filter "label=managed.by=saas-portal")
```