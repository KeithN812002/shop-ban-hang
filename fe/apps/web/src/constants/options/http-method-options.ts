export enum HttpMethodEnum {
    GET = 'GET',
    POST = 'POST',
    PUT = 'PUT',
    PATCH = 'PATCH',
    DELETE = 'DELETE',
}

export const HTTP_METHOD_OPTIONS = [
    { value: HttpMethodEnum.GET, label: HttpMethodEnum.GET },
    { value: HttpMethodEnum.POST, label: HttpMethodEnum.POST },
    { value: HttpMethodEnum.PUT, label: HttpMethodEnum.PUT },
    { value: HttpMethodEnum.PATCH, label: HttpMethodEnum.PATCH },
    { value: HttpMethodEnum.DELETE, label: HttpMethodEnum.DELETE },
] as const
