/**
 * Azure ELK Stack Blueprint
 * Deploys Elasticsearch, Logstash, and Kibana on Azure Container Instances
 * Optimized for Node.js application logging via Winston or Pino
 */

# Auto-generate secure password for Elasticsearch
resource "random_password" "elasticsearch_password" {
  length  = 32
  special = true
}

# Container Group for ELK Stack
resource "azurerm_container_group" "elk" {
  name                = "aci-elk-${var.environment}${local.name_suffix}"
  location            = var.location
  resource_group_name = var.resource_group_name
  os_type             = "Linux"
  dns_name_label      = "elk-${var.environment}${local.name_suffix}"
  ip_address_type     = "Public"

  # Elasticsearch Container
  container {
    name   = "elasticsearch"
    image  = "docker.elastic.co/elasticsearch/elasticsearch:${var.elk_version}"
    cpu    = var.elasticsearch_cpu
    memory = var.elasticsearch_memory

    ports {
      port     = local.elasticsearch_port
      protocol = "TCP"
    }

    # Use command to pass Elasticsearch settings as JVM properties
    commands = [
      "/bin/bash",
      "-c",
      "bin/elasticsearch -Ediscovery.type=single-node -Expack.security.enabled=true -Expack.ml.enabled=false"
    ]

    environment_variables = {
      "ES_JAVA_OPTS"     = "-Xms${var.elasticsearch_heap_size} -Xmx${var.elasticsearch_heap_size}"
      "ELASTIC_USERNAME" = "elastic"
    }

    secure_environment_variables = {
      "ELASTIC_PASSWORD" = random_password.elasticsearch_password.result
    }

    volume {
      name                 = "elasticsearch-data"
      mount_path           = "/usr/share/elasticsearch/data"
      storage_account_name = azurerm_storage_account.elk.name
      storage_account_key  = azurerm_storage_account.elk.primary_access_key
      share_name           = azurerm_storage_share.elasticsearch.name
    }
  }

  # Logstash Container
  container {
    name   = "logstash"
    image  = "docker.elastic.co/logstash/logstash:${var.elk_version}"
    cpu    = var.logstash_cpu
    memory = var.logstash_memory

    ports {
      port     = local.logstash_port
      protocol = "TCP"
    }

    environment_variables = {
      "LS_JAVA_OPTS"           = "-Xms${var.logstash_heap_size} -Xmx${var.logstash_heap_size}"
      "ELASTICSEARCH_HOSTS"    = "http://localhost:${local.elasticsearch_port}"
      "ELASTICSEARCH_USERNAME" = "elastic"
    }

    secure_environment_variables = {
      "ELASTICSEARCH_PASSWORD" = random_password.elasticsearch_password.result
    }

    volume {
      name       = "logstash-pipeline"
      mount_path = "/usr/share/logstash/pipeline"
      read_only  = true
      secret = {
        "logstash.conf" = base64encode(templatefile("${path.module}/config/logstash.conf", {
          elasticsearch_host = "localhost"
          elasticsearch_port = local.elasticsearch_port
        }))
      }
    }
  }

  # Kibana Container
  container {
    name   = "kibana"
    image  = "docker.elastic.co/kibana/kibana:${var.elk_version}"
    cpu    = var.kibana_cpu
    memory = var.kibana_memory

    ports {
      port     = local.kibana_port
      protocol = "TCP"
    }

    environment_variables = {
      "ELASTICSEARCH_HOSTS"    = "http://localhost:${local.elasticsearch_port}"
      "ELASTICSEARCH_USERNAME" = "elastic"
      "SERVER_NAME"            = "kibana-${var.environment}"
      "SERVER_HOST"            = "0.0.0.0"
    }

    secure_environment_variables = {
      "ELASTICSEARCH_PASSWORD" = random_password.elasticsearch_password.result
    }
  }

  tags = local.common_tags
}

# Storage Account for ELK persistence
resource "azurerm_storage_account" "elk" {
  name                     = "elksa${var.environment}${local.storage_suffix}"
  resource_group_name      = var.resource_group_name
  location                 = var.location
  account_tier             = "Standard"
  account_replication_type = "LRS"

  tags = local.common_tags
}

# File Share for Elasticsearch data
resource "azurerm_storage_share" "elasticsearch" {
  name                 = "elasticsearch-data"
  storage_account_name = azurerm_storage_account.elk.name
  quota                = var.elasticsearch_storage_gb
}

# Optional: Network Security Group to restrict access
resource "azurerm_network_security_group" "elk" {
  count               = var.create_nsg ? 1 : 0
  name                = "nsg-elk-${var.environment}"
  location            = var.location
  resource_group_name = var.resource_group_name

  # Allow Kibana access
  security_rule {
    name                       = "Allow-Kibana"
    priority                   = 100
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = tostring(local.kibana_port)
    source_address_prefixes    = var.allowed_ip_ranges
    destination_address_prefix = "*"
  }

  # Allow Logstash (for Node.js apps)
  security_rule {
    name                       = "Allow-Logstash"
    priority                   = 110
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = tostring(local.logstash_port)
    source_address_prefixes    = var.allowed_ip_ranges
    destination_address_prefix = "*"
  }

  tags = local.common_tags
}
