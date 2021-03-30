import { EntityRepository, Repository } from 'typeorm'
import { Attestation } from './attestation.entity'

@EntityRepository(Attestation)
export class AttestationRepository extends Repository<Attestation> {}
