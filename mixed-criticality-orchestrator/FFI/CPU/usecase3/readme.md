
##Building podman image for QM Application and copying podman image to QM container 
-----------------------------------------------------------------------------------
1. Building Podman image of Spaceinvaders QM Application in ASIl
    a. $ cd cpustress-app/
    b. $ sudo podman build -t cpu-stress-app .
2. saving the podman image to QM partition home folder as .tar file
    a. $ sudo podman save -o /usr/lib/qm/rootfs/home/cpu-stress-app.tar localhost/cpu-stress-app:latest
3. loading the .tar file image inside the QM Container
        a. $ sudo podman exec -it qm bash (execing into QM container)
        b.  # cd home/
        c.  # podman load -i cpu-stress-app.tar 

