FROM amazonlinux
RUN yum -y install git
RUN yum -y groupinstall 'Development Tools'

RUN curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.6/install.sh | bash
RUN /bin/bash -c "source /root/.nvm/nvm.sh; nvm install 6.10"

# TODO: Get this to run automatically with the correct permissions
# CMD /bin/bash -c "./eth/bin/dockerCommands.sh"