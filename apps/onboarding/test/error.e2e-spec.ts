import { KomenciLoggerModule } from '@app/komenci-logger'
import { ApiError, ErrorMeta } from '@app/komenci-logger/errors'
import { ApiErrorFilter } from '@app/komenci-logger/filters/api-error.filter'
import { RootError } from '@celo/base/lib/result'
import { Controller, Get } from '@nestjs/common'
import { APP_FILTER } from '@nestjs/core'
import { Test, TestingModule } from '@nestjs/testing'
import { assert } from 'console'

const request = require('supertest')

class ExampleApiError extends ApiError<'ExampleApiError'> {
  statusCode = 400

  constructor() {
    super('ExampleApiError')
    this.message = 'This is an example error'
  }
}

class ExampleApiErrorWithMetadata extends ApiError<'ExampleApiError'> {
  statusCode = 400


  constructor(
    @ErrorMeta('address') readonly address: string,
    @ErrorMeta('count') readonly count: number
  ) {
    super('ExampleApiError')
    this.message = 'This is an example error'
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

  @Get('throwApiErrorWithMetadata')
  async throwApiErrorWithMetadata() {
    throw new ExampleApiErrorWithMetadata("0x0", 100)
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
        KomenciLoggerModule.forRoot({
          pinoHttp: {
            prettyPrint: true
          }
        })
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

  describe('/throwApiErrorWithMetadata (GET)', () => {
    it('Returns 400 with data', async () => {
      const resp = await request(app.getHttpServer()).get('/throwApiErrorWithMetadata')
      // console.log(resp.body)
      expect(resp.statusCode).toBe(400)
      expect(await resp.body).toEqual({
        errorType: 'ExampleApiError',
        statusCode: 400,
        message: 'This is an example error',
        metadata: {
          address: "0x0",
          count: 100
        }
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
