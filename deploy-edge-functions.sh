#!/bin/bash

# ============================================================================
# Supabase Edge Functions Deployment Script
# ============================================================================
# This script deploys all Edge Functions to your Supabase project.
# 
# Prerequisites:
#   1. Supabase CLI installed: npm install -g supabase
#   2. Logged in to Supabase: supabase login
#   3. Project linked: supabase link --project-ref YOUR_PROJECT_REF
#
# Usage:
#   ./deploy-edge-functions.sh              # Deploy all functions
#   ./deploy-edge-functions.sh ai-generate  # Deploy specific function
#   ./deploy-edge-functions.sh --dry-run    # Show what would be deployed
# ============================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
FUNCTIONS_DIR="supabase/functions"
LOG_FILE="deploy-edge-functions.log"

# List of all Edge Functions to deploy
EDGE_FUNCTIONS=(
    "ai-coach"
    "ai-generate"
    "check-user-exists"
    "contact-us"
    "create-razorpay-order"
    "create-razorpay-subscription"
    "delete-user"
    "razorpay-webhook"
    "verify-razorpay-payment"
)

# Required environment variables for Edge Functions
REQUIRED_SECRETS=(
    "OPENROUTER_API_KEY"
    "RAZORPAY_KEY_ID"
    "RAZORPAY_KEY_SECRET"
    "RAZORPAY_WEBHOOK_SECRET"
)

# ============================================================================
# Helper Functions
# ============================================================================

print_header() {
    echo ""
    echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║${NC}  $1"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

log_message() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

check_prerequisites() {
    print_header "Checking Prerequisites"
    
    # Check if Supabase CLI is installed
    if ! command -v supabase &> /dev/null; then
        print_error "Supabase CLI is not installed."
        echo ""
        echo "Install it with:"
        echo "  npm install -g supabase"
        echo "  # or"
        echo "  brew install supabase/tap/supabase"
        exit 1
    fi
    print_success "Supabase CLI is installed"
    
    # Check if logged in
    if ! supabase projects list &> /dev/null 2>&1; then
        print_error "Not logged in to Supabase."
        echo ""
        echo "Run: supabase login"
        exit 1
    fi
    print_success "Logged in to Supabase"
    
    # Check if project is linked
    if [ ! -f "supabase/.temp/project-ref" ]; then
        print_warning "Project may not be linked."
        echo ""
        echo "Run: supabase link --project-ref YOUR_PROJECT_REF"
        echo ""
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    else
        PROJECT_REF=$(cat supabase/.temp/project-ref)
        print_success "Project linked: $PROJECT_REF"
    fi
    
    # Check if functions directory exists
    if [ ! -d "$FUNCTIONS_DIR" ]; then
        print_error "Functions directory not found: $FUNCTIONS_DIR"
        exit 1
    fi
    print_success "Functions directory found"
}

check_secrets() {
    print_header "Checking Required Secrets"
    
    print_info "The following secrets should be set in your Supabase project:"
    echo ""
    
    for secret in "${REQUIRED_SECRETS[@]}"; do
        echo "  • $secret"
    done
    
    echo ""
    print_info "Set secrets with: supabase secrets set SECRET_NAME=value"
    echo ""
}

validate_function() {
    local func_name=$1
    local func_path="$FUNCTIONS_DIR/$func_name"
    
    if [ ! -d "$func_path" ]; then
        print_error "Function directory not found: $func_path"
        return 1
    fi
    
    if [ ! -f "$func_path/index.ts" ]; then
        print_error "index.ts not found in: $func_path"
        return 1
    fi
    
    return 0
}

deploy_function() {
    local func_name=$1
    local dry_run=$2
    
    if [ "$dry_run" = true ]; then
        print_info "[DRY RUN] Would deploy: $func_name"
        return 0
    fi
    
    echo -n "  Deploying $func_name... "
    log_message "Deploying $func_name"
    
    if supabase functions deploy "$func_name" --no-verify-jwt 2>> "$LOG_FILE"; then
        echo -e "${GREEN}✓${NC}"
        log_message "Successfully deployed $func_name"
        return 0
    else
        echo -e "${RED}✗${NC}"
        log_message "Failed to deploy $func_name"
        return 1
    fi
}

deploy_all_functions() {
    local dry_run=$1
    local failed=0
    local succeeded=0
    local skipped=0
    
    print_header "Deploying Edge Functions"
    
    for func_name in "${EDGE_FUNCTIONS[@]}"; do
        if validate_function "$func_name"; then
            if deploy_function "$func_name" "$dry_run"; then
                ((succeeded++))
            else
                ((failed++))
            fi
        else
            print_warning "Skipping $func_name (validation failed)"
            ((skipped++))
        fi
    done
    
    echo ""
    print_header "Deployment Summary"
    print_success "Succeeded: $succeeded"
    if [ $failed -gt 0 ]; then
        print_error "Failed: $failed"
    fi
    if [ $skipped -gt 0 ]; then
        print_warning "Skipped: $skipped"
    fi
    
    if [ $failed -gt 0 ]; then
        echo ""
        print_info "Check $LOG_FILE for detailed error messages"
        return 1
    fi
    
    return 0
}

deploy_single_function() {
    local func_name=$1
    local dry_run=$2
    
    print_header "Deploying Single Function: $func_name"
    
    if validate_function "$func_name"; then
        if deploy_function "$func_name" "$dry_run"; then
            print_success "Deployment complete!"
            return 0
        else
            print_error "Deployment failed. Check $LOG_FILE for details."
            return 1
        fi
    else
        print_error "Function validation failed"
        return 1
    fi
}

show_help() {
    echo "Supabase Edge Functions Deployment Script"
    echo ""
    echo "Usage:"
    echo "  $0                      Deploy all Edge Functions"
    echo "  $0 <function-name>      Deploy a specific function"
    echo "  $0 --dry-run            Show what would be deployed"
    echo "  $0 --list               List all available functions"
    echo "  $0 --check-secrets      Show required secrets"
    echo "  $0 --help               Show this help message"
    echo ""
    echo "Available functions:"
    for func in "${EDGE_FUNCTIONS[@]}"; do
        echo "  • $func"
    done
    echo ""
    echo "Examples:"
    echo "  $0                      # Deploy all functions"
    echo "  $0 ai-generate          # Deploy only ai-generate function"
    echo "  $0 ai-coach ai-generate # Deploy multiple specific functions"
    echo ""
}

list_functions() {
    print_header "Available Edge Functions"
    
    for func_name in "${EDGE_FUNCTIONS[@]}"; do
        local func_path="$FUNCTIONS_DIR/$func_name"
        if [ -d "$func_path" ] && [ -f "$func_path/index.ts" ]; then
            print_success "$func_name"
        else
            print_warning "$func_name (not found)"
        fi
    done
}

# ============================================================================
# Main Script
# ============================================================================

main() {
    # Initialize log file
    echo "=== Deployment started at $(date) ===" > "$LOG_FILE"
    
    # Parse arguments
    DRY_RUN=false
    SPECIFIC_FUNCTIONS=()
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --dry-run)
                DRY_RUN=true
                shift
                ;;
            --help|-h)
                show_help
                exit 0
                ;;
            --list)
                list_functions
                exit 0
                ;;
            --check-secrets)
                check_secrets
                exit 0
                ;;
            -*)
                print_error "Unknown option: $1"
                echo "Use --help for usage information"
                exit 1
                ;;
            *)
                SPECIFIC_FUNCTIONS+=("$1")
                shift
                ;;
        esac
    done
    
    # Check prerequisites
    check_prerequisites
    
    # Show secrets reminder
    check_secrets
    
    # Deploy functions
    if [ ${#SPECIFIC_FUNCTIONS[@]} -eq 0 ]; then
        # Deploy all functions
        deploy_all_functions $DRY_RUN
    else
        # Deploy specific functions
        print_header "Deploying Selected Functions"
        local failed=0
        for func_name in "${SPECIFIC_FUNCTIONS[@]}"; do
            if validate_function "$func_name"; then
                if ! deploy_function "$func_name" $DRY_RUN; then
                    ((failed++))
                fi
            else
                print_error "Invalid function: $func_name"
                ((failed++))
            fi
        done
        
        if [ $failed -gt 0 ]; then
            exit 1
        fi
    fi
    
    echo ""
    print_header "Next Steps"
    echo "1. Verify functions are running:"
    echo "   supabase functions list"
    echo ""
    echo "2. Check function logs:"
    echo "   supabase functions logs <function-name>"
    echo ""
    echo "3. Test your deployed functions in the app"
    echo ""
    
    log_message "Deployment completed"
}

# Run main function
main "$@"
