const { RateLimiterMemory } = require('rate-limiter-flexible');

// Configure different rate limiters for different endpoints
const rateLimiters = {
  // General API rate limiter - 100 requests per 15 minutes per IP
  general: new RateLimiterMemory({
    keyPrefix: 'general_limit',
    points: 100, // Number of requests
    duration: 900, // Per 15 minutes (in seconds)
    blockDuration: 300, // Block for 5 minutes if limit exceeded
  }),

  // BOM generation rate limiter - 10 requests per hour per IP (more resource intensive)
  bomGeneration: new RateLimiterMemory({
    keyPrefix: 'bom_generation_limit',
    points: 10, // Number of requests
    duration: 3600, // Per 1 hour (in seconds)
    blockDuration: 1800, // Block for 30 minutes if limit exceeded
  }),

  // Document upload rate limiter - 20 uploads per hour per IP
  documentUpload: new RateLimiterMemory({
    keyPrefix: 'document_upload_limit',
    points: 20, // Number of uploads
    duration: 3600, // Per 1 hour (in seconds)
    blockDuration: 1800, // Block for 30 minutes if limit exceeded
  }),

  // LLM API calls rate limiter - 200 calls per hour per IP
  llmCalls: new RateLimiterMemory({
    keyPrefix: 'llm_calls_limit',
    points: 200, // Number of LLM API calls
    duration: 3600, // Per 1 hour (in seconds)
    blockDuration: 900, // Block for 15 minutes if limit exceeded
  })
};

// Middleware factory function
const createRateLimitMiddleware = (limiterName) => {
  const limiter = rateLimiters[limiterName];
  
  if (!limiter) {
    throw new Error(`Rate limiter '${limiterName}' not found`);
  }

  return async (req, res, next) => {
    try {
      // Use IP address as the key, but could be enhanced with user authentication
      const key = getClientIdentifier(req);
      
      // Consume 1 point
      const resRateLimiter = await limiter.consume(key);
      
      // Set rate limit headers
      res.set({
        'X-RateLimit-Limit': limiter.points,
        'X-RateLimit-Remaining': resRateLimiter.remainingPoints,
        'X-RateLimit-Reset': new Date(Date.now() + resRateLimiter.msBeforeNext).toISOString()
      });

      next();
    } catch (rejRes) {
      // Rate limit exceeded
      const remainingPoints = rejRes.remainingPoints || 0;
      const msBeforeNext = rejRes.msBeforeNext || 0;
      const totalHits = rejRes.totalHits || 0;

      res.set({
        'X-RateLimit-Limit': limiter.points,
        'X-RateLimit-Remaining': remainingPoints,
        'X-RateLimit-Reset': new Date(Date.now() + msBeforeNext).toISOString(),
        'Retry-After': Math.round(msBeforeNext / 1000) || 1,
      });

      res.status(429).json({
        success: false,
        error: 'Too Many Requests',
        message: `Rate limit exceeded. Try again in ${Math.round(msBeforeNext / 1000)} seconds.`,
        details: {
          limit: limiter.points,
          remaining: remainingPoints,
          resetTime: new Date(Date.now() + msBeforeNext).toISOString(),
          totalRequests: totalHits
        }
      });
    }
  };
};

// Helper function to get client identifier
const getClientIdentifier = (req) => {
  // Priority order: authenticated user ID, forwarded IP, remote IP
  return req.user?.id || 
         req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
         req.headers['x-real-ip'] ||
         req.connection.remoteAddress ||
         req.socket.remoteAddress ||
         (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
         'unknown';
};

// Enhanced rate limiter for specific resource-intensive operations
const createAdaptiveRateLimiter = (basePoints, duration, blockDuration) => {
  return new RateLimiterMemory({
    keyPrefix: 'adaptive_limit',
    points: basePoints,
    duration: duration,
    blockDuration: blockDuration,
    execEvenly: true, // Spread requests evenly across the duration
  });
};

// Burst protection for rapid successive requests
const burstProtection = new RateLimiterMemory({
  keyPrefix: 'burst_protection',
  points: 5, // 5 requests
  duration: 10, // Per 10 seconds
  blockDuration: 30, // Block for 30 seconds
});

const burstProtectionMiddleware = async (req, res, next) => {
  try {
    const key = getClientIdentifier(req);
    await burstProtection.consume(key);
    next();
  } catch (rejRes) {
    res.status(429).json({
      success: false,
      error: 'Burst Limit Exceeded',
      message: 'Too many requests in a short time period. Please slow down.',
      retryAfter: Math.round(rejRes.msBeforeNext / 1000)
    });
  }
};

// Cost-based rate limiting for expensive operations
const costBasedLimiter = new RateLimiterMemory({
  keyPrefix: 'cost_based_limit',
  points: 100, // 100 cost units per hour
  duration: 3600, // Per 1 hour
  blockDuration: 1800, // Block for 30 minutes
});

const createCostBasedMiddleware = (cost) => {
  return async (req, res, next) => {
    try {
      const key = getClientIdentifier(req);
      await costBasedLimiter.consume(key, cost);
      
      res.set({
        'X-Cost-Limit': costBasedLimiter.points,
        'X-Cost-Used': cost,
        'X-Cost-Remaining': (await costBasedLimiter.get(key))?.remainingPoints || costBasedLimiter.points
      });

      next();
    } catch (rejRes) {
      res.status(429).json({
        success: false,
        error: 'Cost Limit Exceeded',
        message: 'API cost limit exceeded. Please try again later.',
        costUsed: cost,
        costLimit: costBasedLimiter.points,
        retryAfter: Math.round(rejRes.msBeforeNext / 1000)
      });
    }
  };
};

// Export configured middleware
module.exports = {
  // Basic rate limiters
  rateLimiter: createRateLimitMiddleware('general'),
  bomGenerationLimiter: createRateLimitMiddleware('bomGeneration'),
  documentUploadLimiter: createRateLimitMiddleware('documentUpload'),
  llmCallsLimiter: createRateLimitMiddleware('llmCalls'),
  
  // Enhanced protection
  burstProtectionMiddleware,
  
  // Cost-based limiting
  lowCostOperation: createCostBasedMiddleware(1),
  mediumCostOperation: createCostBasedMiddleware(5),
  highCostOperation: createCostBasedMiddleware(10),
  
  // Utility functions
  createRateLimitMiddleware,
  createCostBasedMiddleware,
  getClientIdentifier,
  
  // Rate limiter instances for manual use
  rateLimiters
};