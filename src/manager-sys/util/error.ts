export function trimErrorStack(error: Error, numberOfLines: number): string[] {
    const stackLines = error.stack?.split('\n') || [];
    return stackLines.slice(0, numberOfLines)
}