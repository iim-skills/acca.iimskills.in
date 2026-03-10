declare module "gif-frames" {
  interface Frame {
    getImage: () => NodeJS.ReadableStream;
  }

  interface Options {
    url: string;
    frames?: number | number[] | "all" | -1;
    type?: "png" | "jpg" | "canvas";
  }

  function gifFrames(options: Options): Promise<Frame[]>;

  export = gifFrames;
}
