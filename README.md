# JS Blockchain registry

- P2P networking is written from scratch. New nodes auto propagation. Malicious nodes auto blocking
- Uses custom Proof of Authority and validators pool as a consensus algorithm
- Full Paper (74 pages): https://drive.google.com/file/d/1JJ-19L69Da8q83FxyPuI9uX8OwTVtUxV

Web app live demo (different nodes):
https://gval98.com:1111/
https://gval98.com:2222/
https://gval98.com:3333/

Windows full app installer: https://drive.google.com/file/d/1KjR4fgoyj_tnV34QWcvS419CsEp4hzw7

Private keys for sending data: https://drive.google.com/drive/folders/196F09Rt8xN1zJ7KcXRvcLSyK_Hy0_hAc
Раsswоrd: *Valera16*

### Apps:
- Desktop app on Electron for users and nodes. Stores whole blockchain and connects to all nodes
- Adaptive web app for users. Connects to one node and uses API for communicating
- CLI app for nodes and validators. Stores whole blockchain and connects to all nodes
- CLI and web tools for key pairs generation
- CLI tool for genesis block generation

### Stack:

- Electron for desktop app
- Express as a server
- Needle for API requests
- Elliptic for keys generation and signatures
- Crypto-js for SHA-256
- Node-forge for generating certificates
- Bootstrap and jQuery for web and desktop apps 


Desktop app:
![Screenshot](https://i.ibb.co/VqbD5Q1/bc-1.png)

Web app:
![Screenshot](https://i.ibb.co/jTFfMqj/bc-2.jpg)

Key pairs generator:
![Screenshot](https://i.ibb.co/ZYN8R7D/bc-3.png)