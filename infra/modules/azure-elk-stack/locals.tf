locals {
  elasticsearch_port = 9200
  kibana_port        = 5601
  logstash_port      = 5044

  # Handle suffix - only add hyphen if suffix is not empty (for resource names)
  name_suffix = var.suffix != "" ? "-${var.suffix}" : ""

  # Storage account suffix without hyphen (storage account names can't have hyphens)
  storage_suffix = var.suffix

  common_tags = merge(var.tags, {
    "component" = "elk-stack"
  })
}
