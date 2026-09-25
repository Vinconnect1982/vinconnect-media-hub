import {env} from 'cloudflare:workers';
export function mediaBucket(){if(!env.BUCKET)throw Error('Photo storage is unavailable. Please retry shortly.');return env.BUCKET;}
