import 'source-map-support'
import { APIGatewayEvent, APIGatewayProxyResultV2 } from 'aws-lambda'
import S3 from 'aws-sdk/clients/s3'
import fetch from 'node-fetch'
import wkhtmltopdf from 'wkhtmltopdf'
import { INTERNAL_SERVER_ERROR, OK, UNPROCESSABLE_ENTITY } from 'http-status'
import { createError, createResponse } from './helper'
import { UrlParams, urlParamsSchema } from './validator'

const { S3_PDF_FILES_BUCKET, S3_PDF_FILES_URL } = process.env
const s3 = new S3()

interface IHandlerParams {
  url: string
  fileName: string
  filePath?: string
}

export async function handler ({ queryStringParameters }: APIGatewayEvent): Promise<APIGatewayProxyResultV2> {
  let params: UrlParams
  try {
    params = urlParamsSchema.validateSync(queryStringParameters, {
      abortEarly: false,
      stripUnknown: true
    })
  } catch (validationErrors) {
    console.error('pdf.genereate.error.schema', {
      queryStringParameters
    })

    return createResponse(
      UNPROCESSABLE_ENTITY,
      createError(validationErrors.inner)
    )
  }

  const { url, fileName, filePath = 'default' } = params as IHandlerParams

  let response
  try {
    response = await fetch(url)
  } catch (error) {
    console.error(error)
    return createResponse(INTERNAL_SERVER_ERROR, createError(`Unable to download the web page with url: "${url}"`))
  }

  const pdfStream = wkhtmltopdf(response.body, { pageSize: 'letter' })
  const chunks: any[] = []
  for await (const chunk of pdfStream) {
    chunks.push(chunk)
  }

  if (S3_PDF_FILES_BUCKET == null) {
    throw new Error('PDF directory is not defined')
  }

  try {
    await s3
      .putObject({
        ACL: 'public-read',
        Body: Buffer.concat(chunks),
        Bucket: `${S3_PDF_FILES_BUCKET}/${filePath}`,
        ContentType: 'application/pdf',
        Key: fileName
      })
      .promise()
  } catch (error) {
    console.error(error)

    return createResponse(INTERNAL_SERVER_ERROR, createError(`Unable to generate pdf file (url: "${url}")`))
  }

  const result = `https://${S3_PDF_FILES_URL}/${filePath}/${fileName}`
  console.info('pdf.generate.success', { source: url, result })

  return createResponse(OK, {
    url: result
  })
}
