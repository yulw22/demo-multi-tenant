export default () => ({
  dbHost: process.env.DB_HOST ?? 'localhost',
  dbPort: Number(process.env.DB_PORT ?? 5433),
  dockerSocket: process.env.DOCKER_SOCKET ?? '/var/run/docker.sock',
});
