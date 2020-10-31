import { APIGatewayProxyResultV2 } from 'aws-lambda'

export function createResponse (status: number, body?: Record<string, any>): APIGatewayProxyResultV2 {
  return {
    statusCode: status,
    body: body !== null ? JSON.stringify(body) : undefined,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true
    }
  }
}

export function createError (messages: any | any[]): { errors: any[] } {
  return {
    errors: Array.isArray(messages) ? messages : [messages]
  }
}
