import {tmpdir} from 'node:os';
import {join} from 'node:path';
export default {testDir:'./tests',testMatch:'browser.spec.mjs',workers:1,timeout:180000,use:{headless:true},reporter:'list',outputDir:join(tmpdir(),'academy-family-test-results')};
