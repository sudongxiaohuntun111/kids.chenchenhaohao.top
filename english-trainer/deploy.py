import paramiko
import os

host = "47.94.161.94"
username = "root"
password = "BJfh2026"
key_path = os.path.expanduser("~/.ssh/id_ed25519")

# Read the public key
with open(key_path + ".pub") as f:
    pub_key = f.read().strip()

print("Connecting to server...")
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(host, username=username, password=password)
print("Connected!")

# Add public key (use base64 to avoid shell escaping issues)
import base64
key_b64 = base64.b64encode(pub_key.encode()).decode()
cmd = f'mkdir -p ~/.ssh && chmod 700 ~/.ssh && echo "{key_b64}" | base64 -d >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys'
stdin, stdout, stderr = client.exec_command(cmd)
exit_status = stdout.channel.recv_exit_status()
if exit_status == 0:
    print("SSH public key added successfully!")
else:
    print("Error adding key:", stderr.read().decode())

client.close()

# Verify key-based login
print("Verifying key-based login...")
test_client = paramiko.SSHClient()
test_client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
test_client.connect(host, username=username, key_filename=key_path)
print("Key-based login verified!")
test_client.close()

# Get system info
info_client = paramiko.SSHClient()
info_client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
info_client.connect(host, username=username, key_filename=key_path)
stdin, stdout, stderr = info_client.exec_command("cat /etc/os-release | head -3; echo '---KERNEL---'; uname -r; echo '---DISK---'; df -h / | tail -1; echo '---ARCH---'; uname -m")
print("System info:")
print(stdout.read().decode())
info_client.close()
