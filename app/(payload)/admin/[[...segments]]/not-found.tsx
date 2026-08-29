import { NotFoundPage, generatePageMetadata } from '@payloadcms/next/views';
import config from '@payload-config';

import { importMap } from '../importMap.js';

export const generateMetadata = ({ params, searchParams }) =>
  generatePageMetadata({
    config,
    params,
    searchParams,
  });

const NotFound = ({ params, searchParams }) =>
  NotFoundPage({
    config,
    params,
    searchParams,
    importMap,
  });

export default NotFound;