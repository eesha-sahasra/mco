##Building podman image for QM Application and copying podman image to QM container 
-----------------------------------------------------------------------------------
1. Building Podman image of Astray QM Application in ASIl
    a. $ cd Astray_QM_application/
    b. $ sudo podman build -t astray-game .
2. saving the podman image to QM partition home folder as .tar file
    a. $ sudo podman save -o /usr/lib/qm/rootfs/home/astray-game.tar localhost/astray-game:latest
3. loading the .tar file image inside the QM Container
        a. $ sudo podman exec -it qm bash (execing into QM container)
        b.  # cd home/
        c.  # podman load -i astray-game.tar 

