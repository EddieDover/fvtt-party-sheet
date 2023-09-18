import autoprefixer     from 'autoprefixer';             // Adds vendor specific extensions to CSS
import postcssPresetEnv from 'postcss-preset-env';       // Popular postcss plugin for next gen CSS usage.

export default {
   inject: false,                                        // Don't inject CSS into <HEAD>
   extract: `theater-of-the-mind.css`,                   // Output to `theater-of-the-mind.css` in directory of the bundle
   extensions: ['.scss', '.sass', '.css'],               // File extensions
   plugins: [autoprefixer, postcssPresetEnv],            // Postcss plugins to use
   use: ['sass']                                         // Use sass / dart-sass
};