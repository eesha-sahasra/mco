##Building Podman Image for ASIL Application.
----------------------------------------------------------------------------------
    $ cd ASIL_application/
    $ podman build -t vehicle-detection-frame .

##Building Astray podman image for QM Application and copying podman image to QM container 
-----------------------------------------------------------------------------------
1. Building Podman image of Spaceinvaders QM Application in ASIl
    a. $ cd Astray_3_cores_stress/
    b. $ sudo podman build -t astray-3-cores-stress .
2. saving the podman image to QM partition home folder as .tar file
    a. $ sudo podman save -o /usr/lib/qm/rootfs/home/astray-3-cores-stress.tar localhost/astray-3-cores-stress:latest
3. loading the .tar file image inside the QM Container
        a. $ sudo podman exec -it qm bash (execing into QM container)
        b.  # cd home/
        c.  # podman load -i astray-3-cores-stress.tar 

##Building SpaceInvaders podman image for QM Application and copying podman image to QM container 
-----------------------------------------------------------------------------------
1. Building Podman image of Spaceinvaders QM Application in ASIl
    a. $ cd SpaceInvaders_3_cores/
    b. $ sudo podman build -t spaceinvaders-3-cores-stress .
2. saving the podman image to QM partition home folder as .tar file
    a. $ sudo podman save -o /usr/lib/qm/rootfs/home/spaceinvaders-3-cores-stress.tar localhost/spaceinvaders-3-cores-stress:latest
3. loading the .tar file image inside the QM Container
        a. $ sudo podman exec -it qm bash (execing into QM container)
        b.  # cd home/
        c.  # podman load -i spaceinvaders-3-cores-stress.tar 
