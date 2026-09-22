# MemorizeZ Backend

Backend da aplicação MemorizeZ desenvolvido com Spring Boot.

## Requirements

- Java 21
- Maven
- Docker

## Database

O projeto utiliza PostgreSQL executado através do Docker.

### Start database

```bash
docker compose up -d
```
Check database
```
docker compose ps
```
Stop database
```
docker compose down
````
Access PostgreSQL
````
docker exec -it memorizez-postgres psql -U memorizez -d memorizez
````
Inside PostgreSQL
````
\dt
````
Get out
````
\q
````
