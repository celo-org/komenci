import { RootError } from '@celo/base/lib/result'
import { Controller, Get, UseFilters } from '@nestjs/common'
import { APP_FILTER } from '@nestjs/core'
import { Test, TestingModule } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { assert } from 'console'
import { Logger, LoggerModule } from 'nestjs-pino'
import Web3 from 'web3'
import { ApiError } from '../src/errors/api-error'
import { ApiErrorFilter } from '../src/errors/api-error.filter'

const request = require('supertest')

class ExampleApiError extends ApiError<'ExampleApiError'> {
  constructor() {
    super(
      'ExampleApiError',
      'This is an example error',
      400
    )
  }
}

class ExampleRootError extends RootError<'ExampleRootError'> {
  constructor() {
    super('ExampleRootError')
  }
}

@Controller()
export class ErrorController {

  @Get('throwApiError')
  async throwApiError() {
    throw new ExampleApiError()
  }

  @Get('throwRootError')
  async throwRootError() {
    throw new ExampleRootError()
  }

  @Get('throwError')
  async throwError() {
    throw new Error("This is a basic error")
  }
}

describe('ErrorController (e2e)', () => {
  let app

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        LoggerModule.forRoot()
      ],
      controllers: [ErrorController],
      providers: [
        {
          provide: APP_FILTER,
          useClass: ApiErrorFilter,
        }
      ]
    }).compile()

    app = module.createNestApplication()
    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  describe('/throwApiError (GET)', () => {
    it('Returns 400 with data', async () => {
      const resp = await request(app.getHttpServer()).get('/throwApiError')
      // console.log(resp.body)
      expect(resp.statusCode).toBe(400)
      expect(await resp.body).toEqual({
        errorType: 'ExampleApiError',
        statusCode: 400,
        message: 'This is an example error'
      })
    })
  })

  describe('/throwRootError (GET)', () => {
    it('Returns 500 with default data', async () => {
      const resp = await request(app.getHttpServer()).get('/throwRootError')
      // console.log(resp.body)
      expect(resp.statusCode).toBe(500)
      expect(await resp.body).toEqual({
        statusCode: 500,
        message: 'Internal server error'
      })
    })
  })

  describe('/throwError (GET)', () => {
    it('Returns 500 with default data', async () => {
      const resp = await request(app.getHttpServer()).get('/throwError')
      // console.log(resp.body)
      expect(resp.statusCode).toBe(500)
      expect(await resp.body).toEqual({
        statusCode: 500,
        message: 'Internal server error'
      })
    })
  })
})
