import type { NextConfig } from 'next';
const config:NextConfig={
 poweredByHeader:false,
 serverExternalPackages:['@libsql/client','@neondatabase/serverless'],
 outputFileTracingIncludes:{'/*':['./prisma/migrations/**/*.sql']},
};
export default config;
