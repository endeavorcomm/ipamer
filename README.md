# IP Address ManagER
IPAMER was created to help an ISP manage the assignment of static IP addresses for customers. It's built for front-line people who may have little or no knowledge of IPs, subnet masks, gateways, prefixes, etc.

IPAMER is tightly integrated with the NetBox API - thus https://github.com/netbox-community/netbox is a prerequisite of using IPAMER.




# Requirements and IPAMer Install
- [git](https://git-scm.com/downloads)
- [Node.js](https://github.com/nodejs/node)
- [NetBox](https://github.com/netbox-community/netbox)

## These install steps assume you're using an Ubuntu distro - adjust accordingly
    sudo adduser ipamer
    cd /opt
    sudo git clone https://github.com/weendeavor/ipamer.git
    cd ipamer
    sudo npm install
    sudo apt install nano
    sudo nano /etc/systemd/system/ipamer.service

#### Paste the following into the ipamer.service file, save and exit file
    [Unit]
    Description=IPAMer
    After=network.target
    
    [Service]
    Type=simple
    User=ipamer
    ExecStart=/usr/bin/node /opt/ipamer/app.js
    WorkingDirectory=/opt/ipamer
    Restart=on-failure
    
    [Install]
    WantedBy=multi-user.target

#### Finish service setup
    sudo systemctl daemon-reload
    sudo systemctl enable ipamer.service
    sudo systemctl start ipamer.service

    sudo nano /opt/ipamer/.env

#### Add the following into the .env file, where HOST is the FQDN http(s) of your NetBox site. save and exit file
    NETBOX_API_KEY=
    NETBOX_HOST=
    NODE_PORT=

IPAMer listens on port 8080 by default




# NetBox Setup

- configure Site(s), Prefix(es), Address(es) in NetBox
- create an API key for an admin user in NetBox
- create a custom field called 'Subnet'
- create a custom field called 'Gateway'
- create a tag called 'static'

#### NetBox prefixes must have these attributes, in order to be used by IPAMer. See below image for example.
- A Site assigned
- Custom field 'Subnet' filled out
- Custom field 'Gateway' filled out
- Tag of 'static'

![Prefix Example](./prefix.gif)




# Contributing
Please create an issue first, then ask that the issue be assigned to you.




# About
Originally developed by [Jason Creviston](http://github.com/jwc-endeavor)