##Building Podman Image for ASIL Application.
----------------------------------------------------------------------------------
    $ cd ASIL_application/
    $ podman build -t vehicle-detection-frame .

##Building podman image for QM Application and copying podman image to QM container 
-----------------------------------------------------------------------------------
1. Building Podman image of Astray QM Application in ASIl
    a. $ cd pacman_Qm_application/
    b. $ sudo podman build -t pacman-mem-full-stress .
2. saving the podman image to QM partition home folder as .tar file
    a. $ sudo podman save -o /usr/lib/qm/rootfs/home/pacman-mem-full-stress.tar localhost/pacman-mem-full-stress:latest
3. loading the .tar file image inside the QM Container
        a. $ sudo podman exec -it qm bash (execing into QM container)
        b.  # cd home/
        c.  # podman load -i pacman-mem-full-stress.tar 

