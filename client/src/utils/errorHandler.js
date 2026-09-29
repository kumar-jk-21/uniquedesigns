// Converts any Axios/network error into { code, message, fields?, status? } with a user-friendly message.
const BY_STATUS = {
  400: ['BAD_REQUEST', 'The request could not be processed. Please check your input.'],
  401: ['UNAUTHENTICATED', 'Please login to continue.'],
  403: ['FORBIDDEN', 'You do not have permission to perform this action.'],
  404: ['NOT_FOUND', 'The requested item could not be found.'],
  409: ['CONFLICT', 'This action conflicts with existing data.'],
  422: ['VALIDATION_ERROR', 'Please correct the highlighted fields.'],
  429: ['RATE_LIMITED', 'Too many requests. Please wait a moment and try again.'],
  500: ['SERVER_ERROR', 'Something went wrong on our server. Please try again later.'],
  502: ['SERVER_DOWN', 'Server is currently unavailable. Please try again in a few moments.'],
  503: ['SERVER_DOWN', 'Server is currently unavailable. Please try again in a few moments.'],
  504: ['TIMEOUT', 'The request took too long. Please try again.']
};

export function toUserError(err) {
  if (err?.isUserError) return err;
  if (err?.code === 'ECONNABORTED' || err?.code === 'ETIMEDOUT')
    return mk('TIMEOUT', 'The request took too long. Please try again.');
  if (!err?.response)
    return mk('NETWORK_ERROR', 'Unable to connect to the server. Please check your internet connection and try again.');
  const { status, data } = err.response;
  const e = data?.error;
  if (e?.message) return mk(e.code || BY_STATUS[status]?.[0] || 'ERROR', e.message, status, e.fields);
  const [code, message] = BY_STATUS[status] || BY_STATUS[500];
  return mk(code, message, status);
}
const mk = (code, message, status, fields) => ({ isUserError: true, code, message, status, fields: fields || {} });

export const isConnectionError = (e) => ['NETWORK_ERROR', 'SERVER_DOWN', 'TIMEOUT', 'DATABASE_UNAVAILABLE'].includes(e?.code);
