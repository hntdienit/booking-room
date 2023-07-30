export class removeFileEvent {
  folder: string;
  url: string;

  constructor(folder: string, url: string) {
    this.folder = folder;
    this.url = url;
  }
}
