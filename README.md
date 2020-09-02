### Onboarding service (prototype)

This might serve as a base for the development of the onboarding service but at the moment it's just a prototype showing how [NestJS](https://docs.nestjs.com/) can be leveraged in order to structure an application close to our needs.

#### Structure

A Nest monorepo project combines several independent applications and libraries which are used by these applications.
These applications can be either full-blown HTTP servers or [microservices](https://docs.nestjs.com/migration-guide#microservices) where Nest provides us
with efficient and configurable transport mechanism.
In our case we have:

- `apps/onboarding` - the Onboarding Service 
- `apps/relayer` - the Relayer Service which is a TCP microservice
- `libs/blockchain` - dummy lib that could expose a Service which wraps ContractKit and is used by both applications

#### Load balancing

In order to play around with load-balancing the relayers I've also included a toy haproxy config and a docker-compose that spins up a network with one onboarding service pointing to an haproxy that's load-balancing between two relayers.

To test it out run:

```
$ docker-compose -f docker-compose.proxy.yml up
```


This should build everything and spin up the network. After that navigate to [localhost:3000/distributedBlindedPepper](http://localhost:3000/distributedBlindedPepper) and you should see the payload composed in `apps/relayer/src/relayer.service.ts` and we can see how relayers are rotated.




