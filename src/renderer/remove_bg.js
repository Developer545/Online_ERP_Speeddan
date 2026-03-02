const Jimp = require('jimp');

async function makeTransparent() {
    try {
        console.log("Reading image...");
        const image = await Jimp.read('src/assets/logo_speeddansys.png');

        image.scan(0, 0, image.bitmap.width, image.bitmap.height, function (x, y, idx) {
            const r = this.bitmap.data[idx + 0];
            const g = this.bitmap.data[idx + 1];
            const b = this.bitmap.data[idx + 2];

            // Remove pure white background
            if (r > 240 && g > 240 && b > 240) {
                this.bitmap.data[idx + 3] = 0;
            } else if (r > 180 && g > 180 && b > 180) {
                // Soft edge / anti-aliasing treatment for gray/white fringes
                const avg = (r + g + b) / 3;
                const alpha = Math.max(0, Math.floor(255 - ((avg - 180) * (255 / 60))));
                this.bitmap.data[idx + 3] = alpha;

                // Darken the fringe to prevent a white halo on black backgrounds
                this.bitmap.data[idx + 0] = Math.max(0, r - (255 - alpha));
                this.bitmap.data[idx + 1] = Math.max(0, g - (255 - alpha));
                this.bitmap.data[idx + 2] = Math.max(0, b - (255 - alpha));
            }
        });

        console.log("Writing transparent image...");
        await image.writeAsync('src/assets/logo_speeddansys_transparent.png');
        await image.writeAsync('../landing_page/assets/logo_speeddansys_transparent.png');
        console.log("Image processing complete.");
    } catch (error) {
        console.error("Error processing image:", error);
    }
}

makeTransparent();
