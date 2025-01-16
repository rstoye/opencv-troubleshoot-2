import { Injectable } from '@nestjs/common';
import * as openCv from '@u4/opencv4nodejs';
import { join } from 'path';

const docPath = join(__dirname, 'documents');

@Injectable()
export class AppService {
  async getHello(): Promise<void> {
    // return 'Hello World!';
    for (let index = 0; index <= 1000; index++) {
      console.info(`${index} - imreadAsync`);
      const image = await openCv.imreadAsync(join(docPath, 'test.jpg'));

      console.info(`${index} - getVerticalLines`);
      let line = (await getVerticalLines(image))[0];
      if (!line) return;

      const angleAdjust = line.angle - 90;
      console.info(`${index} - Adjusting angle by ${angleAdjust}°`);
      const center = new openCv.Point2(image.cols / 2, image.rows / 2);
      const rotationMatrix = openCv.getRotationMatrix2D(center, angleAdjust, 1);

      console.info(`${index} - warpAffine`);
      const angleAdjustedImage = image.warpAffine(
        rotationMatrix,
        new openCv.Size(image.cols, image.rows),
        openCv.INTER_LINEAR,
        openCv.BORDER_CONSTANT,
        new openCv.Vec3(255, 255, 255),
      );

      console.info(`${index} - release image`);
      image.release();

      // const newFileName = join(docPath, `test${index}.jpg`);
      // await openCv.imwriteAsync(newFileName, angleAdjustedImage);
      console.info(`${index} - release angleAdjustedImage`);
      angleAdjustedImage.release();
      console.info('---------------------------------');
    }
  }
}

const getVerticalLines = async (img: openCv.Mat) => {
  let processedImage = await img.bgrToGrayAsync();

  processedImage = await processedImage.cannyAsync(255, 255);
  processedImage = await processedImage.dilateAsync(
    openCv.getStructuringElement(openCv.MORPH_RECT, new openCv.Size(5, 5)),
  );
  processedImage = await processedImage.erodeAsync(
    openCv.getStructuringElement(openCv.MORPH_RECT, new openCv.Size(5, 5)),
  );

  const contours = processedImage.findContours(
    openCv.RETR_LIST,
    openCv.CHAIN_APPROX_SIMPLE,
  );

  // Filter contours based on size and position
  return contours
    .filter((contour) => {
      const { x, width, height } = contour.boundingRect();
      const aspectRatio = height / width;
      const isVertical = aspectRatio > 1;
      const isLongVertical = height > 1000;
      const isRelativelyCentered =
        x > img.cols / 2.5 - width && x < img.cols / 1.5 + width;

      return isVertical && isLongVertical && isRelativelyCentered;
    })
    .map((contour) => {
      const rect = contour.boundingRect();
      const points = contour.getPoints();

      let minY = points[0].y;
      let maxY = points[0].y;

      points.forEach((point) => {
        minY = Math.min(minY, point.y);
        maxY = Math.max(maxY, point.y);
      });

      const topRight = points
        .filter((p) => p.y == minY)
        .sort((a, b) => b.x - a.x)[0];

      const bottomRight = points
        .filter((p) => p.y == maxY)
        .sort((a, b) => b.x - a.x)[0];

      let angle =
        (Math.atan2(bottomRight.y - topRight.y, bottomRight.x - topRight.x) *
          180) /
        Math.PI;

      return {
        angle,
        end: bottomRight,
        height: rect.height,
        start: topRight,
        width: rect.width,
      };
    });
};
