##Building Podman Image for ASIL Application.
----------------------------------------------------------------------------------
    $ cd ASIL_application/
    $ podman build -t vehicle-detection-frame .

##Building podman image for QM Application and copying podman image to QM container 
-----------------------------------------------------------------------------------
1. Building Podman image of Astray QM Application in ASIl
    a. $ cd Astray_QM_application/
    b. $ sudo podman build -t astray-full-cores-stress .
2. saving the podman image to QM partition home folder as .tar file
    a. $ sudo podman save -o /usr/lib/qm/rootfs/home/astray-full-cores-stress.tar localhost/astray-full-cores-stress:latest
3. loading the .tar file image inside the QM Container
        a. $ sudo podman exec -it qm bash (execing into QM container)
        b.  # cd home/
        c.  # podman load -i astray-full-cores-stress.tar 

