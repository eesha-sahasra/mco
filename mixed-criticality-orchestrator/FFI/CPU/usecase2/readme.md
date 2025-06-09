##Building Podman Image for ASIL Application.
----------------------------------------------------------------------------------
    $ cd ASIL_application/
    $ podman build -t vehicle-detection-frame .

##Building podman image for QM Application and copying podman image to QM container 
-----------------------------------------------------------------------------------
1. Building Podman image of Spaceinvaders QM Application in ASIl
    a. $ cd Spaceinvaders_full_stress_code/
    b. $ sudo podman build -t spaceinvaders-full-stress .
2. saving the podman image to QM partition home folder as .tar file
    a. $ sudo podman save -o /usr/lib/qm/rootfs/home/spaceinvaders-full-stress.tar localhost/spaceinvaders-full-stress:latest
3. loading the .tar file image inside the QM Container
        a. $ sudo podman exec -it qm bash (execing into QM container)
        b.  # cd home/
        c.  # podman load -i spaceinvaders-full-stress.tar 

