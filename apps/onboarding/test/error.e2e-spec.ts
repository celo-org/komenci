import { Controller, Get, UseFilters } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { assert } from 'console'
import Web3 from 'web3'
import { ApiError } from '../src/errors/api-error'
import { ApiErrorFilter } from '../src/errors/api-error.filter'
import { RootError } from '@celo/base/lib/result'

const request = require('supertest')

@Controller()
export class ErrorController {

  @Get('error')
  async error() {
    throw new ApiError('ApiError message', 'e2e-error', 400)
  }
}

describe('ErrorController (e2e)', () => {
  let app

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ErrorController],
    })
      .compile()

    app = module.createNestApplication()
    app.useGlobalFilters(new ApiErrorFilter())
    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  describe('/error (GET)', () => {
    it('Returns 400 with data', async () => {
      const resp = await request(app.getHttpServer()).get('/error')
      // console.log(resp.body)
      expect(resp.statusCode).toBe(400)
      expect(await resp.body).toEqual({})

    })
  })
})
