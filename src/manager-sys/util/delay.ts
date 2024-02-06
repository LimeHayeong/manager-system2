export async function delay(min: number, max: number) {
    return new Promise<void>((resolve) => {
        const second = Math.floor(Math.random() * (max - min + 1) + min);
      setTimeout(() => {
        resolve();
      }, second * 1000);
    });
  }
  