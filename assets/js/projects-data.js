window.PROJECTS = [
  {
    id: "autohuntx-recon",
    name: "AutoHuntX Recon",
    tagline: "Cyber Kill Chain reconnaissance engine",
    description: "Phase-aware reconnaissance automation that orchestrates 15 adapters (DNS enumeration, WHOIS, Wayback Machine, threat-intel APIs) into one unified attack-surface view. Library-first and extensible, built to observe and record, never to act beyond reconnaissance.",
    stack: ["Python", "Recon Automation", "Threat Intel APIs"],
    repo: "https://github.com/Marky3012/AutoHuntX-Recon",
    demo: "https://marky3012.github.io/AutoHuntX-Recon/",
    thumb: "assets/img/autohuntx-live-screenshot.png",
    featured: true
  },
  {
    id: "soc-log-analyzer",
    name: "SOC Log Analyzer",
    tagline: "Log analysis and threat detection for SOC teams",
    description: "Parses Windows Event Logs and Sysmon telemetry, normalizes diverse log formats into one schema, and runs a YAML-based rule engine for common attack patterns, with color-coded console alerts and JSON export for further analysis.",
    stack: ["Python", "Windows Event Logs", "Detection Rules"],
    repo: "https://github.com/Marky3012/Python_Log_Analyzer",
    demo: null,
    thumb: null,
    featured: true
  },
  {
    id: "wazuh-ha-ops",
    name: "Wazuh HA Ops",
    tagline: "Autonomous Ansible framework for a HA SIEM deployment",
    description: "Operates a Wazuh SIEM behind HAProxy and Keepalived for automatic failover, with a single-entrypoint Ansible playbook covering inventory, deployment, and day-to-day operations across a multi-node cluster.",
    stack: ["Ansible", "Wazuh", "HAProxy", "Keepalived"],
    repo: "https://github.com/Marky3012/Ansible_Check",
    demo: null,
    thumb: null,
    diagram: true,
    featured: true
  },
  {
    id: "postgres-ha-cluster",
    name: "PostgreSQL HA Cluster",
    tagline: "4-node Patroni and etcd cluster, deployed and validated",
    description: "An orchestrator that stands up a 4-node PostgreSQL 17 cluster with Patroni-managed streaming replication and an etcd quorum watcher, paired with an end-to-end validation framework covering failover, failback, disaster recovery, and RTO/RPO compliance with JSON, HTML, and PDF reports.",
    stack: ["Python", "PostgreSQL", "Patroni", "etcd"],
    repo: "https://github.com/Marky3012/postgres-ha-patroni-",
    demo: "https://marky3012.github.io/postgres-ha-patroni-/",
    thumb: "assets/img/postgres-ha-live-screenshot.png",
    featured: true
  },
  {
    id: "security-lab-reports",
    name: "Security Lab Reports",
    tagline: "TryHackMe and VulnHub writeups, in one place",
    description: "A centralized, markdown-first archive of lab reports and writeups from TryHackMe, VulnHub, and independent research, documenting the methodology behind a top 1% global TryHackMe ranking.",
    stack: ["Markdown", "Pentesting", "Documentation"],
    repo: "https://github.com/Marky3012/Personal-Reports",
    demo: null,
    thumb: null,
    featured: false
  },
  {
    id: "linux-essentials",
    name: "Linux Essentials",
    tagline: "Shell and Python scripts for Linux administration",
    description: "A working set of Bash and Python scripts for day-to-day Linux administration and health checks, refined from real deployment work across Ubuntu, Kali, and CentOS environments.",
    stack: ["Shell", "Python", "Linux"],
    repo: "https://github.com/Marky3012/Linux_Essential",
    demo: null,
    thumb: null,
    featured: false
  }
];

window.TOPOLOGY_DIAGRAM = `  Wazuh Agents (port 1514)
         |
         v
  VIP 172.21.1.120 / enp1s0      VRRP  router_id 51
         |
   +-----+-----+
   |           |
172.21.1.93  172.21.1.94
HAProxy       HAProxy
Keepalived    Keepalived
MASTER (150)  BACKUP (140)
   |           |
   +-----+-----+
         | leastconn / tcp-check
  +------+------+------+
  |      |      |      |
 mgr1   mgr2   mgr3   mgr4
:1514 each, across two subnets`;
