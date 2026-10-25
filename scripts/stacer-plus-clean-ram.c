#define _GNU_SOURCE
#include <unistd.h>
#include <fcntl.h>
#include <stdio.h>
#include <stdlib.h>

int main(void) {
    if (setuid(0) != 0) {
        // Setuid might not be set or permitted, continue anyway
    }
    sync();
    int fd = open("/proc/sys/vm/drop_caches", O_WRONLY);
    if (fd < 0) {
        perror("Failed to open /proc/sys/vm/drop_caches");
        return 1;
    }
    if (write(fd, "3\n", 2) != 2) {
        perror("Failed to write to /proc/sys/vm/drop_caches");
        close(fd);
        return 1;
    }
    close(fd);
    return 0;
}
