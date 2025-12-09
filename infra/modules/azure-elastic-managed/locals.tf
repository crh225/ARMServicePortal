locals {
  common_tags = merge(var.tags, {
    "component" = "elastic-managed"
  })
}
