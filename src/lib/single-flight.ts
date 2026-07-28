export function createSingleFlightTask<T>(
  task: () => Promise<T>
) {
  let activeTask: Promise<T> | null = null;

  return function runSingleFlightTask() {
    if (activeTask) {
      return activeTask;
    }

    const taskPromise = task();
    const trackedTask = taskPromise.finally(() => {
      if (activeTask === trackedTask) {
        activeTask = null;
      }
    });
    activeTask = trackedTask;

    return activeTask;
  };
}
