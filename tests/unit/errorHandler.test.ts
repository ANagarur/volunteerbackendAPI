// Pure unit tests for the error-handling middleware — no DB, no HTTP,
// just mocked Express req/res/next objects.
import { z } from 'zod';
import { Request, Response } from 'express';
import { AppError, errorHandler } from '../../src/middleware/errorHandler';

function mockResponse() {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res as Response;
}

describe('errorHandler', () => {
  let consoleErrorSpy: jest.SpiedFunction<typeof console.error>;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('responds 400 with flattened details for a ZodError', () => {
    const schema = z.object({ name: z.string() });
    const result = schema.safeParse({});
    const res = mockResponse();

    errorHandler(result.error, {} as Request, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Validation failed' })
    );
  });

  it('responds with the AppError status code and message', () => {
    const res = mockResponse();

    errorHandler(new AppError(404, 'Volunteer not found'), {} as Request, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Volunteer not found' });
  });

  it('responds 500 for an unrecognized thrown error and logs it', () => {
    const res = mockResponse();
    const err = new Error('Something exploded');

    errorHandler(err, {} as Request, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
    expect(consoleErrorSpy).toHaveBeenCalledWith(err);
  });

  it('responds 500 for a non-Error thrown value', () => {
    const res = mockResponse();

    errorHandler('a plain string was thrown', {} as Request, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
  });
});
