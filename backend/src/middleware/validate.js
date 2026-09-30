/**
 * Input validation middleware foundation.
 *
 * Provides a reusable pattern for request validation.
 * Future phases will use libraries like Joi or Zod for schema validation.
 */

/**
 * Creates a validation middleware from a validation schema function.
 *
 * @param {Function} schemaFn - A function that receives (req.body, req.query, req.params)
 *                              and returns { isValid: boolean, errors: string[] }
 *
 * Usage (future):
 *   const validateRegister = validate((body) => {
 *     const errors = [];
 *     if (!body.email) errors.push('Email is required');
 *     if (!body.password) errors.push('Password is required');
 *     return { isValid: errors.length === 0, errors };
 *   });
 *   router.post('/register', validateRegister, controller);
 */
export const validate = (schemaFn) => {
  return (req, res, next) => {
    const result = schemaFn(req.body, req.query, req.params);

    if (!result.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: result.errors,
      });
    }

    next();
  };
};

export default validate;
