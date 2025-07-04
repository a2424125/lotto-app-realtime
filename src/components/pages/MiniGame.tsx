[22:13:02.004] Running build in Washington, D.C., USA (East) – iad1
[22:13:02.004] Build machine configuration: 2 cores, 8 GB
[22:13:02.041] Cloning github.com/a2424125/lotto-app-realtime (Branch: main, Commit: c8777b8)
[22:13:02.481] Cloning completed: 440.000ms
[22:13:03.206] Restored build cache from previous deployment (DftouUfAoEC7sXM59zkvMcezbYEy)
[22:13:03.999] Running "vercel build"
[22:13:04.444] Vercel CLI 44.2.10
[22:13:05.238] Warning: Due to "engines": { "node": "18.x" } in your `package.json` file, the Node.js Version defined in your Project Settings ("22.x") will not apply, Node.js Version "18.x" will be used instead. Learn More: http://vercel.link/node-version
[22:13:05.243] Installing dependencies...
[22:13:07.990] npm warn EBADENGINE Unsupported engine {
[22:13:07.991] npm warn EBADENGINE   package: 'undici@7.11.0',
[22:13:07.991] npm warn EBADENGINE   required: { node: '>=20.18.1' },
[22:13:07.991] npm warn EBADENGINE   current: { node: 'v18.20.6', npm: '10.8.2' }
[22:13:07.991] npm warn EBADENGINE }
[22:13:08.295] 
[22:13:08.296] up to date in 3s
[22:13:08.296] 
[22:13:08.296] 285 packages are looking for funding
[22:13:08.297]   run `npm fund` for details
[22:13:08.299] npm notice
[22:13:08.299] npm notice New major version of npm available! 10.8.2 -> 11.4.2
[22:13:08.299] npm notice Changelog: https://github.com/npm/cli/releases/tag/v11.4.2
[22:13:08.299] npm notice To update run: npm install -g npm@11.4.2
[22:13:08.299] npm notice
[22:13:08.317] Running "npm run vercel-build"
[22:13:08.446] 
[22:13:08.447] > lotto-realtime-app@2.0.0 vercel-build
[22:13:08.447] > react-scripts build
[22:13:08.447] 
[22:13:09.927] Creating an optimized production build...
[22:13:21.512] Failed to compile.
[22:13:21.512] 
[22:13:21.518] TS2339: Property 'color' does not exist on type '{ x: number; y: number; }'.
[22:13:21.518]   [0m [90m 1349 |[39m                     height[33m:[39m [32m"20px"[39m[33m,[39m
[22:13:21.518]    [90m 1350 |[39m                     borderRadius[33m:[39m [32m"50%"[39m[33m,[39m
[22:13:21.518]   [31m[1m>[22m[39m[90m 1351 |[39m                     backgroundColor[33m:[39m drawGame[33m.[39mballPosition[33m?[39m[33m.[39mcolor [33m===[39m [32m'gold'[39m [33m?[39m [32m'#fbbf24'[39m [33m:[39m 
[22:13:21.518]    [90m      |[39m                                                             [31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m
[22:13:21.518]    [90m 1352 |[39m                                    drawGame[33m.[39mballPosition[33m?[39m[33m.[39mcolor [33m===[39m [32m'red'[39m [33m?[39m [32m'#ef4444'[39m [33m:[39m
[22:13:21.519]    [90m 1353 |[39m                                    drawGame[33m.[39mballPosition[33m?[39m[33m.[39mcolor [33m===[39m [32m'blue'[39m [33m?[39m [32m'#3b82f6'[39m [33m:[39m
[22:13:21.519]    [90m 1354 |[39m                                    drawGame[33m.[39mballPosition[33m?[39m[33m.[39mcolor [33m===[39m [32m'purple'[39m [33m?[39m [32m'#8b5cf6'[39m [33m:[39m [32m'#10b981'[39m[33m,[39m[0m
[22:13:21.519] 
[22:13:21.519] 
[22:13:21.549] Error: Command "npm run vercel-build" exited with 1
[22:13:21.908] 
[22:13:25.051] Exiting build container
