defmodule OliWeb.Delivery.StudentDashboard.StudentDashboardLive do
  use OliWeb, :live_view

  import OliWeb.Common.Utils

  alias OliWeb.Delivery.StudentDashboard.Components.Helpers
  alias alias Oli.Delivery.Sections
  alias Oli.Delivery.Metrics
  alias Oli.Grading.GradebookRow

  @impl Phoenix.LiveView
  def mount(_params, _session, socket) do
    survey_responses =
      case socket.assigns.section do
        %{required_survey_resource_id: nil} ->
          []

        %{required_survey_resource_id: required_survey_resource_id} ->
          Oli.Delivery.Attempts.summarize_survey(
            required_survey_resource_id,
            socket.assigns.student.id
          )
      end

    {:ok, assign(socket, survey_responses: survey_responses)}
  end

  @impl Phoenix.LiveView
  def handle_params(%{"active_tab" => "content"} = params, _, socket) do
    socket =
      socket
      |> assign(
        params: params,
        active_tab: String.to_existing_atom(params["active_tab"])
      )
      |> assign_new(:containers, fn ->
        get_containers(socket.assigns.section, socket.assigns.student.id)
      end)

    {:noreply, socket}
  end

  @impl Phoenix.LiveView
  def handle_params(%{"active_tab" => "learning_objectives"} = params, _, socket) do
    socket =
      socket
      |> assign(params: params, active_tab: String.to_existing_atom(params["active_tab"]))
      |> assign_new(:objectives_tab, fn ->
        %{
          objectives: Sections.get_objectives_and_subobjectives(socket.assigns.section.slug),
          filter_options:
            Sections.get_units_and_modules_from_a_section(socket.assigns.section.slug)
        }
      end)

    {:noreply, socket}
  end

  @impl Phoenix.LiveView
  def handle_params(%{"active_tab" => "quizz_scores"} = params, _, socket) do
    socket =
      socket
      |> assign(
        params: params,
        active_tab: String.to_existing_atom(params["active_tab"])
      )
      |> assign_new(:scores, fn ->
        %{scores: get_scores(socket.assigns.section, socket.assigns.student.id)}
      end)

    {:noreply, socket}
  end

  @impl Phoenix.LiveView
  def handle_params(%{"active_tab" => "progress"} = params, _, socket) do
    socket =
      socket
      |> assign(params: params, active_tab: String.to_existing_atom(params["active_tab"]))
      |> assign_new(:pages, fn ->
        get_page_nodes(socket.assigns.section.slug, socket.assigns.student.id)
      end)

    {:noreply, socket}
  end

  @impl Phoenix.LiveView
  def handle_params(params, _, socket) do
    {:noreply,
     assign(socket,
       params: params,
       active_tab: String.to_existing_atom(params["active_tab"])
     )}
  end

  @impl Phoenix.LiveView
  def render(assigns) do
    ~H"""
      <Helpers.section_details_header section_title={@section.title} student_name={@student.name}/>
      <Helpers.student_details survey_responses={@survey_responses || []} student={@student} />
      <Helpers.tabs active_tab={@active_tab} section_slug={@section.slug} student_id={@student.id} preview_mode={@preview_mode} />
      <%= render_tab(assigns) %>
    """
  end

  defp render_tab(%{active_tab: :content} = assigns) do
    ~H"""
      <.live_component
      id="content_tab"
      module={OliWeb.Delivery.StudentDashboard.Components.ContentTab}
      params={@params}
      section_slug={@section.slug}
      containers={@containers}
      student_id={@student.id}
      />
    """
  end

  defp render_tab(%{active_tab: :learning_objectives} = assigns) do
    ~H"""
      <.live_component
      id="learning_objectives_tab"
      module={OliWeb.Delivery.StudentDashboard.Components.LearningObjectivesTab}
      params={@params}
      section_slug={@section.slug}
      objectives_tab={@objectives_tab}
      student_id={@student.id}
      />
    """
  end

  defp render_tab(%{active_tab: :quizz_scores} = assigns) do
    ~H"""
      <.live_component
        id="quiz_scores_table"
        module={OliWeb.Delivery.StudentDashboard.Components.QuizzScoresTab}
        params={@params}
        section={@section}
        patch_url_type={:quiz_scores_student}
        student_id={@student.id}
        scores={@scores}
      />
    """
  end

  defp render_tab(%{active_tab: :progress} = assigns) do
    ~H"""
      <.live_component
        id="progress_tab"
        module={OliWeb.Delivery.StudentDashboard.Components.ProgressTab}
        params={@params}
        section_slug={@section.slug}
        student_id={@student.id}
        context={@context}
        pages={@pages}
      />
    """
  end

  @impl Phoenix.LiveView
  def handle_event("breadcrumb-navigate", _unsigned_params, socket) do
    if socket.assigns.preview_mode do
      {:noreply,
       redirect(socket,
         to:
           Routes.instructor_dashboard_path(
             socket,
             :preview,
             socket.assigns.section.slug,
             :students
           )
       )}
    else
      {:noreply,
       redirect(socket,
         to:
           Routes.live_path(
             socket,
             OliWeb.Delivery.InstructorDashboard.InstructorDashboardLive,
             socket.assigns.section.slug,
             :students
           )
       )}
    end
  end

  defp get_containers(section, student_id) do
    {total_count, containers} = Sections.get_units_and_modules_containers(section.slug)

    student_progress =
      get_students_progress(
        total_count,
        containers,
        section.id,
        student_id
      )

    # TODO get real student engagement and student mastery values
    # when those metrics are ready (see Oli.Delivery.Metrics)

    containers_with_metrics =
      Enum.map(containers, fn container ->
        Map.merge(container, %{
          progress: student_progress[container.id] || 0.0,
          student_engagement: Enum.random(["Low", "Medium", "High", "Not enough data"]),
          student_mastery: Enum.random(["Low", "Medium", "High", "Not enough data"])
        })
      end)

    {total_count, containers_with_metrics}
  end

  defp get_students_progress(0, pages, section_id, student_id) do
    page_ids = Enum.map(pages, fn p -> p.id end)

    Metrics.progress_across_for_pages(
      section_id,
      page_ids,
      student_id
    )
  end

  defp get_students_progress(_total_count, containers, section_id, student_id) do
    container_ids = Enum.map(containers, fn c -> c.id end)

    Metrics.progress_across(
      section_id,
      container_ids,
      student_id
    )
  end

  defp get_scores(section, student_id) do
    {gradebook, _column_labels} = Oli.Grading.generate_gradebook_for_section(section)

    if length(gradebook) > 0 do
      [%GradebookRow{user: _user, scores: scores} | _] =
        Enum.filter(gradebook, fn grade -> grade.user.id == student_id end)

      Enum.filter(scores, fn score -> !is_nil(score) end)
    else
      []
    end
  end

  defp get_page_nodes(section_slug, student_id) do
    resource_accesses =
      Oli.Delivery.Attempts.Core.get_resource_accesses(
        section_slug,
        student_id
      )
      |> Enum.reduce(%{}, fn r, m ->
        # limit score decimals to two significant figures, rounding up
        r =
          case r.score do
            nil -> r
            _ -> Map.put(r, :score, format_score(r.score))
          end

        Map.put(m, r.resource_id, r)
      end)

    hierarchy = Oli.Publishing.DeliveryResolver.full_hierarchy(section_slug)

    page_nodes =
      hierarchy
      |> Oli.Delivery.Hierarchy.flatten()
      |> Enum.filter(fn node ->
        node.revision.resource_type_id ==
          Oli.Resources.ResourceType.get_id_by_type("page")
      end)

    Enum.with_index(page_nodes, fn node, index ->
      ra = Map.get(resource_accesses, node.revision.resource_id)

      %{
        resource_id: node.revision.resource_id,
        node: node,
        index: index,
        title: node.revision.title,
        type: if(node.revision.graded, do: "Graded", else: "Practice"),
        score: if(is_nil(ra), do: nil, else: ra.score),
        out_of: if(is_nil(ra), do: nil, else: ra.out_of),
        number_attempts: if(is_nil(ra), do: 0, else: ra.resource_attempts_count),
        number_accesses: if(is_nil(ra), do: 0, else: ra.access_count),
        updated_at: if(is_nil(ra), do: nil, else: ra.updated_at),
        inserted_at: if(is_nil(ra), do: nil, else: ra.inserted_at)
      }
    end)
  end
end
