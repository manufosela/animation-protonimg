import resolve from 'rollup-plugin-node-resolve';
import babel from 'rollup-plugin-babel';
import copy from 'rollup-plugin-copy';
import { terser } from 'rollup-plugin-terser';

export default {
  preserveSymlinks: true,
  input: ['./animation-protonimg.js'],
  output: {
    dir: './dist/js',
    format: 'es',
    sourcemap: true,
  },
  plugins: [
    resolve(),
    babel(),
    terser({
      output: {
        comments: false,
      },
    }),
    copy({
      targets: [{
        src: './animation-protonimg.js',
        dest: './dist/js',
      },{
        src: './demo/css/styles.css',
        dest: './dist/css',
      },{
        src: './demo/img/*',
        dest: './dist/img',
      },{
        src: './demo/index.html',
        dest: './dist',
        transform: (contents) => contents.toString().replace('<script type="module" src="..', '<script type="module" src="js')
      }],
    }),
  ],
};

