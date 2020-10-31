import { object, string, InferType } from 'yup'

export const urlParamsSchema = object().shape({
  url: string().required(),
  fileName: string().required(),
  filePath: string()
})

export type UrlParams = InferType<typeof urlParamsSchema>
