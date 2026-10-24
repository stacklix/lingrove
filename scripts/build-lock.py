"""Run a build under an OS file lock shared by all build entry points."""
from contextlib import contextmanager
import errno
import os
from pathlib import Path
import subprocess
import sys
import time

if os.name == 'nt':
    import msvcrt
else:
    import fcntl


@contextmanager
def build_lock(lock_path):
    lock_path = Path(lock_path)
    lock_path.parent.mkdir(parents=True, exist_ok=True)
    # Unlinking an open lock could let another process lock a different file at
    # the same path. Keep the file permanently; only the OS lock is released.
    descriptor = os.open(lock_path, os.O_RDWR | os.O_CREAT, 0o600)
    with os.fdopen(descriptor, 'r+b', buffering=0) as lock:
        waiting = False
        while True:
            try:
                lock.seek(0)
                if os.name == 'nt':
                    msvcrt.locking(lock.fileno(), msvcrt.LK_NBLCK, 1)
                else:
                    fcntl.flock(lock.fileno(), fcntl.LOCK_EX | fcntl.LOCK_NB)
                break
            except OSError as error:
                if error.errno not in (errno.EACCES, errno.EAGAIN, errno.EDEADLK):
                    raise
                if not waiting:
                    print('[build] Waiting for another build to finish...', flush=True)
                    waiting = True
                time.sleep(0.2)
        try:
            lock.seek(0)
            lock.write(f'{os.getpid()}\n'.encode('ascii'))
            lock.truncate()
            yield
        finally:
            lock.seek(0)
            if os.name == 'nt':
                msvcrt.locking(lock.fileno(), msvcrt.LK_UNLCK, 1)
            else:
                fcntl.flock(lock.fileno(), fcntl.LOCK_UN)


def main():
    with build_lock(sys.argv[1]):
        # Keep the lock until the actual build exits, even if the outer npm/Node
        # launcher is terminated in the meantime.
        child = subprocess.Popen(sys.argv[2:])
        while True:
            try:
                return child.wait()
            except KeyboardInterrupt:
                # The terminal also sends Ctrl+C to the child. Wait for that
                # child to finish shutting down before releasing the lock.
                continue


if __name__ == '__main__':
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        sys.exit(130)
